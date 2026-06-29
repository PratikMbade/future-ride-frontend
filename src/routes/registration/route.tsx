import RegisterPage from '#/components/auth/RgistrationPage'
import { createFileRoute } from '@tanstack/react-router'

import { z } from 'zod';

const searchSchema = z.object({
  ref:             z.coerce.string().optional().default(''),
  referralAddress: z.coerce.string().optional().default(''),
});

export const Route = createFileRoute('/registration')({
  component: RegisterPage,
  validateSearch: searchSchema,
});



