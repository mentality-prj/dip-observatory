import { redirect } from 'next/navigation'
import { studioHref } from '@/lib/platform-urls'

export default function StudioHome() {
  redirect(studioHref('profiles'))
}
