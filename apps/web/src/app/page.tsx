'use client'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { getSession } from 'next-auth/react'

export default function Home() {
  const router = useRouter()
  useEffect(() => {
    getSession().then((s) => router.replace(s ? '/painel' : '/login'))
  }, [router])
  return null
}
