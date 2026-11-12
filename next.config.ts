import type {NextConfig} from 'next';
const config: NextConfig = {
  output: 'standalone',
  poweredByHeader: false,
  serverExternalPackages: ['sharp'],
  experimental: {serverActions: {bodySizeLimit: '18mb'}},
  async headers() {
    return [
      {source:'/:path*',headers:[
        {key:'X-Content-Type-Options',value:'nosniff'},
        {key:'X-Frame-Options',value:'DENY'},
        {key:'Referrer-Policy',value:'same-origin'},
        {key:'Permissions-Policy',value:'camera=(), microphone=(), geolocation=()'},
      ]},
      {source:'/suivi/:rest*',headers:[{key:'Referrer-Policy',value:'no-referrer'}]},
      ...['admin','compte','panier','commande','suivi','connexion','inscription','api'].map(path=>({
        source:'/'+path+'/:rest*',
        headers:[{key:'X-Robots-Tag',value:'noindex, nofollow'},{key:'Cache-Control',value:'private, no-store'}],
      })),
    ];
  },
};
export default config;
