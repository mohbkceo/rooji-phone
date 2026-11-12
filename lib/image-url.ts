export const widths = [320,640,960,1440] as const;
export const imageId = /^[a-f0-9]{32}$/;
export const imageUrl=(asset:string,width=640)=>imageId.test(asset)?'/media/'+asset+'/'+width+'.png':asset.startsWith('/photos/')?asset.replace(/\.png$/,'-'+width+'.png'):asset;
