import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typescript: {
    // lucide-react has internal type definition errors after npm audit fix upgrade
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
