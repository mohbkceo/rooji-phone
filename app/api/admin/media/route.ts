import {currentUser,throttle} from '@/lib/auth';
import {uploadImage} from '@/lib/media';
import {InputError} from '@/lib/security';

export async function POST(request:Request) {
 const user=await currentUser();
 if(!user||user.role!=='admin')return Response.json({error:'Accès refusé.'},{status:403});
 const base=process.env.SITE_URL||new URL(request.url).origin;
 if(request.headers.get('origin')!==new URL(base).origin)return Response.json({error:'Origine invalide.'},{status:403});
 try{
  await throttle('upload',user.id);
  if(Number(request.headers.get('content-length'))>9*1024*1024)throw new InputError('8 Mo maximum par fichier.');
  const file=(await request.formData()).get('photo');
  if(!(file instanceof File))throw new InputError('Sélectionnez une photo.');
  return Response.json({id:await uploadImage(file,'public')});
 }catch(error){
  return Response.json({error:error instanceof InputError?error.message:'Import impossible.'},{status:400});
 }
}
