import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import Stripe from 'stripe';
import pg from 'pg';
import crypto from 'node:crypto';

const app = express();
const port = Number(process.env.PORT || 10000);
const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL, ssl: process.env.DATABASE_URL && !process.env.DATABASE_URL.includes('localhost') ? { rejectUnauthorized: false } : false, max: 10, connectionTimeoutMillis: 5000 });
const stripe = process.env.STRIPE_SECRET_KEY ? new Stripe(process.env.STRIPE_SECRET_KEY) : null;
const origins = (process.env.FRONTEND_ORIGINS || 'https://hsw365.github.io,https://hsw365.co').split(',').map(s => s.trim()).filter(Boolean);
app.set('trust proxy', 1);
app.use(helmet());
app.use(cors({ origin(origin, cb) { if (!origin || origins.includes(origin)) return cb(null, true); return cb(new Error('Origin is not allowed.')); }, methods: ['GET','POST','OPTIONS'], allowedHeaders: ['Content-Type','Authorization'] }));
const authLimit = rateLimit({ windowMs: 900000, limit: 12, standardHeaders: 'draft-7', legacyHeaders: false });
const apiLimit = rateLimit({ windowMs: 60000, limit: 90, standardHeaders: 'draft-7', legacyHeaders: false });

async function migrate() {
  await pool.query('CREATE TABLE IF NOT EXISTS users (id UUID PRIMARY KEY, email TEXT UNIQUE NOT NULL, password_hash TEXT NOT NULL, created_at TIMESTAMPTZ NOT NULL DEFAULT NOW())');
  await pool.query('CREATE TABLE IF NOT EXISTS subscriptions (id UUID PRIMARY KEY, user_id UUID UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE, stripe_customer_id TEXT UNIQUE, stripe_subscription_id TEXT UNIQUE, stripe_price_id TEXT, plan TEXT NOT NULL DEFAULT \'free\', status TEXT NOT NULL DEFAULT \'inactive\', current_period_end TIMESTAMPTZ, cancel_at_period_end BOOLEAN NOT NULL DEFAULT FALSE, updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW())');
}
function tokenFor(user) { return jwt.sign({ sub: user.id, email: user.email }, process.env.JWT_SECRET, { expiresIn: '7d', issuer: 'liveface365-api', audience: 'liveface365-client' }); }
function auth(req,res,next) {
  const h = req.get('authorization') || '';
  if (!h.startsWith('Bearer ')) return res.status(401).json({ error: 'Sign in to continue.' });
  try { req.identity = jwt.verify(h.slice(7), process.env.JWT_SECRET, { issuer: 'liveface365-api', audience: 'liveface365-client' }); next(); }
  catch { return res.status(401).json({ error: 'Session expired. Sign in again.' }); }
}
function planFor(price) { if (price && price === process.env.STRIPE_CREATOR_PRICE_ID) return 'creator'; if (price && price === process.env.STRIPE_STUDIO_PRICE_ID) return 'studio'; return 'free'; }
app.get('/health', async (_req,res) => { try { await pool.query('SELECT 1'); res.json({ ok:true, service:'liveface365-api', database:'connected', billingConfigured:Boolean(stripe) }); } catch { res.status(503).json({ ok:false, service:'liveface365-api', database:'unavailable' }); } });
app.get('/api/status', (_req,res) => res.json({ service:'LiveFace365 API', authentication:Boolean(process.env.JWT_SECRET), database:Boolean(process.env.DATABASE_URL), billing:Boolean(stripe && process.env.STRIPE_WEBHOOK_SECRET && process.env.STRIPE_CREATOR_PRICE_ID && process.env.STRIPE_STUDIO_PRICE_ID), faceEngine:Boolean(process.env.FACE_ENGINE_URL && process.env.FACE_ENGINE_API_KEY) }));

app.post('/api/auth/register', authLimit, express.json({limit:'10kb'}), async (req,res) => {
  const email = typeof req.body?.email === 'string' ? req.body.email.trim().toLowerCase() : '';
  const password = typeof req.body?.password === 'string' ? req.body.password : '';
  if (!/^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/.test(email)) return res.status(400).json({error:'Enter a valid email address.'});
  if (password.length < 12 || password.length > 128) return res.status(400).json({error:'Password must be 12–128 characters.'});
  try {
    const id = crypto.randomUUID(), hash = await bcrypt.hash(password,12);
    const result = await pool.query('INSERT INTO users(id,email,password_hash) VALUES($1,$2,$3) RETURNING id,email',[id,email,hash]);
    await pool.query('INSERT INTO subscriptions(id,user_id,plan,status) VALUES($1,$2,$3,$4)',[crypto.randomUUID(),id,'free','inactive']);
    res.status(201).json({user:result.rows[0],token:tokenFor(result.rows[0]),notice:'Email verification and password recovery must be configured before broad public launch.'});
  } catch (e) { if(e.code==='23505') return res.status(409).json({error:'An account with that email already exists.'}); console.error('register',e.message); res.status(500).json({error:'Could not create account.'}); }
});
app.post('/api/auth/login', authLimit, express.json({limit:'10kb'}), async (req,res) => {
  const email = typeof req.body?.email === 'string' ? req.body.email.trim().toLowerCase() : '';
  const password = typeof req.body?.password === 'string' ? req.body.password : '';
  try {
    const result = await pool.query('SELECT id,email,password_hash FROM users WHERE email=$1',[email]);
    const user = result.rows[0];
    if(!user || !(await bcrypt.compare(password,user.password_hash))) return res.status(401).json({error:'Email or password is incorrect.'});
    res.json({user:{id:user.id,email:user.email},token:tokenFor(user)});
  } catch(e) { console.error('login',e.message); res.status(500).json({error:'Could not sign in.'}); }
});
app.get('/api/me', auth, async (req,res) => {
  try {
    const q = await pool.query('SELECT u.id,u.email,s.plan,s.status,s.current_period_end,s.cancel_at_period_end FROM users u LEFT JOIN subscriptions s ON s.user_id=u.id WHERE u.id=$1',[req.identity.sub]);
    if(!q.rows[0]) return res.status(404).json({error:'Account not found.'});
    const r=q.rows[0], active=['active','trialing'].includes(r.status);
    res.json({user:{id:r.id,email:r.email},subscription:{plan:active?(r.plan||'free'):'free',status:r.status||'inactive',currentPeriodEnd:r.current_period_end,cancelAtPeriodEnd:Boolean(r.cancel_at_period_end)}});
  } catch(e) { console.error('me',e.message); res.status(500).json({error:'Could not load account.'}); }
});
app.post('/api/billing/checkout', apiLimit, express.json({limit:'10kb'}), auth, async (req,res) => {
  if(!stripe) return res.status(503).json({error:'Billing is not configured yet.'});
  const plan=req.body?.plan, price=plan==='creator'?process.env.STRIPE_CREATOR_PRICE_ID:plan==='studio'?process.env.STRIPE_STUDIO_PRICE_ID:null;
  if(!price) return res.status(400).json({error:'Choose a valid subscription plan.'});
  try {
    const userQ=await pool.query('SELECT id,email FROM users WHERE id=$1',[req.identity.sub]);
    if(!userQ.rows[0]) return res.status(404).json({error:'Account not found.'});
    const customerQ=await pool.query('SELECT stripe_customer_id FROM subscriptions WHERE user_id=$1 AND stripe_customer_id IS NOT NULL',[req.identity.sub]);
    const customer=customerQ.rows[0]?.stripe_customer_id;
    const base=process.env.FRONTEND_URL||'https://hsw365.github.io/liveface365';
    const session=await stripe.checkout.sessions.create({mode:'subscription',line_items:[{price,quantity:1}],customer:customer||undefined,customer_email:customer?undefined:userQ.rows[0].email,client_reference_id:req.identity.sub,metadata:{userId:req.identity.sub,plan},subscription_data:{metadata:{userId:req.identity.sub,plan}},success_url:base+'/?billing=success',cancel_url:base+'/?billing=cancelled',allow_promotion_codes:true});
    res.json({url:session.url});
  } catch(e) { console.error('checkout',e.message); res.status(502).json({error:'Could not start checkout. Verify Stripe price IDs and account configuration.'}); }
});
app.post('/api/billing/portal', apiLimit, express.json({limit:'2kb'}), auth, async (req,res) => {
  if(!stripe) return res.status(503).json({error:'Billing is not configured yet.'});
  try {
    const q=await pool.query('SELECT stripe_customer_id FROM subscriptions WHERE user_id=$1 AND stripe_customer_id IS NOT NULL',[req.identity.sub]);
    if(!q.rows[0]) return res.status(400).json({error:'No billing customer is linked to this account yet.'});
    const session=await stripe.billingPortal.sessions.create({customer:q.rows[0].stripe_customer_id,return_url:process.env.FRONTEND_URL||'https://hsw365.github.io/liveface365'});
    res.json({url:session.url});
  } catch(e) { console.error('portal',e.message); res.status(502).json({error:'Could not open billing portal. Check Stripe Customer Portal configuration.'}); }
});
app.post('/api/billing/webhook', express.raw({type:'application/json',limit:'1mb'}), async (req,res) => {
  if(!stripe||!process.env.STRIPE_WEBHOOK_SECRET) return res.status(503).send('Webhook is not configured.');
  let event;
  try { event=stripe.webhooks.constructEvent(req.body,req.headers['stripe-signature'],process.env.STRIPE_WEBHOOK_SECRET); }
  catch(e) { return res.status(400).send('Invalid webhook signature: '+e.message); }
  try {
    const o=event.data.object;
    if(event.type==='checkout.session.completed' && o.mode==='subscription' && o.subscription && o.metadata?.userId) {
      const sub=await stripe.subscriptions.retrieve(o.subscription), price=sub.items.data[0]?.price?.id||null;
      await pool.query('INSERT INTO subscriptions(id,user_id,stripe_customer_id,stripe_subscription_id,stripe_price_id,plan,status,current_period_end,cancel_at_period_end) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9) ON CONFLICT(user_id) DO UPDATE SET stripe_customer_id=EXCLUDED.stripe_customer_id,stripe_subscription_id=EXCLUDED.stripe_subscription_id,stripe_price_id=EXCLUDED.stripe_price_id,plan=EXCLUDED.plan,status=EXCLUDED.status,current_period_end=EXCLUDED.current_period_end,cancel_at_period_end=EXCLUDED.cancel_at_period_end,updated_at=NOW()',
      [crypto.randomUUID(),o.metadata.userId,String(sub.customer),sub.id,price,planFor(price),sub.status,sub.current_period_end?new Date(sub.current_period_end*1000):null,Boolean(sub.cancel_at_period_end)]);
    }
    if(event.type.startsWith('customer.subscription.')) {
      const sub=o, price=sub.items?.data?.[0]?.price?.id||null;
      await pool.query('UPDATE subscriptions SET stripe_customer_id=$1,stripe_subscription_id=$2,stripe_price_id=$3,plan=$4,status=$5,current_period_end=$6,cancel_at_period_end=$7,updated_at=NOW() WHERE stripe_subscription_id=$2',
      [String(sub.customer),sub.id,price,planFor(price),sub.status||'canceled',sub.current_period_end?new Date(sub.current_period_end*1000):null,Boolean(sub.cancel_at_period_end)]);
    }
    if(event.type==='invoice.payment_failed') await pool.query("UPDATE subscriptions SET status='past_due',updated_at=NOW() WHERE stripe_customer_id=$1",[String(o.customer||'')]);
    res.json({received:true});
  } catch(e) { console.error('webhook processing',event.type,e.message); res.status(500).send('Webhook processing failed; Stripe may retry.'); }
});
app.use(express.json({limit:'25kb'}));
app.use(apiLimit);
app.use((err,_req,res,_next)=>{console.error('API error',err.message);res.status(err.message?.includes('Origin')?403:500).json({error:err.message?.includes('Origin')?err.message:'Unexpected server error.'});});
migrate().then(()=>app.listen(port,'0.0.0.0',()=>console.log('LiveFace365 API listening on '+port))).catch(e=>{console.error('Database migration failed:',e.message);process.exit(1);});
process.on('SIGTERM',async()=>{await pool.end();process.exit(0);});
