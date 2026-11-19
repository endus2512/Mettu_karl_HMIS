import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      disallow: [
        '/admin',
        '/dashboard',
        '/login',
        '/patient-login',
        '/patient-portal',
        '/portal/',
        '/patients',
        '/records',
        '/api/',
      ],
    },
  };
}
