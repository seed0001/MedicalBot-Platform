/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  /**
   * Exported as static files and served by the API process, so the whole app
   * is one Railway service on one origin. That is not just simpler to deploy —
   * it is what makes auth work. Two services would sit on different
   * *.up.railway.app subdomains, which browsers treat as separate sites because
   * that domain is on the public suffix list, so the SameSite=Lax session
   * cookie would never be sent with API calls.
   *
   * Every page here is a client component that fetches at runtime, so there is
   * nothing that needs a Node server at request time.
   */
  output: 'export',
  env: {
    // Empty means same-origin relative URLs. Only set this if the API is
    // genuinely hosted somewhere else.
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL ?? '',
  },
}

export default nextConfig
