This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

### Contentful Setup
 
1. Create a `.env.local` file at the project root with:


```
CONTENTFUL_SPACE=your_space_id
CONTENTFUL_DELIVERY_API=your_cda_access_token
CONTENTFUL_CHILDREN_S_SPACE_DELIVERY_API=your_cda_access_token_for_childrens_space
CONTENTFUL_PDF_GEN_CT=patient_education_content_type_id
CONTENTFUL_ENVIRONMENT=your_environment_id # defaults to develop if omitted
```

2. Ensure your Contentful entries have fields: `title` (Text), `subtitle` (Text), `body` (Rich Text), and `slug` (Short text).

3. The Patient Education page route format is: `/pt-ed/<slug>`.

### Development

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

Example: `http://localhost:3000/pt-ed/example-slug`

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
