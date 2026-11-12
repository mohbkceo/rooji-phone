import {get,run} from '../lib/db.ts';
import {email,parse} from '../lib/validation.ts';
import {hashPassword,id,secret,timestamp} from '../lib/security.ts';

async function main() {
 secret();
 const address=parse(email,process.env.ADMIN_EMAIL);
 const password=process.env.ADMIN_PASSWORD||'';
 if(password.length<14||password.length>160)throw Error('ADMIN_PASSWORD doit contenir entre 14 et 160 caractères.');
 if(get('SELECT id FROM users WHERE email=?',address))throw Error('Cet email existe déjà.');
 run("INSERT INTO users(id,email,password,role,name,created) VALUES(?,?,?,'admin','Administration',?)",id(),address,await hashPassword(password),timestamp());
 console.log('Compte administrateur créé.');
}
main().catch(error=>{console.error(error.message);process.exitCode=1;});
