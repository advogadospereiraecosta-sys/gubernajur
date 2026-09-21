'use client'

import { LogOut } from 'lucide-react'
import { signOut } from 'next-auth/react'

export function SignOutButton() {
  return (
    <button
      onClick={() => signOut({ callbackUrl: '/login' })}
      className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-red-600 transition-colors hover:bg-red-50 dark:hover:bg-red-900/20"
    >
      <LogOut className="h-4 w-4" />
      Sair
    </button>
  )
}
