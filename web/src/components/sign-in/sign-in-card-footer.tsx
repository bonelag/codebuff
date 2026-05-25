'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { SignInButton } from './sign-in-button'
import { CardFooter } from '../ui/card'
import { Button } from '@/components/ui/button'
import { Icons } from '@/components/icons'
import { toast } from '@/components/ui/use-toast'

export const BypassLoginButton = ({ authCode }: { authCode?: string | null }) => {
  const [isLoading, setIsLoading] = useState(false)
  const searchParams = useSearchParams() ?? new URLSearchParams()

  const handleBypassLogin = async () => {
    setIsLoading(true)
    try {
      let callbackUrl = '/'
      if (authCode) {
        callbackUrl = `/onboard?${searchParams.toString()}`
      }

      const res = await fetch(`/api/auth/bypass?callbackUrl=${encodeURIComponent(callbackUrl)}`, {
        method: 'POST',
      })

      if (!res.ok) {
        throw new Error('Bypass request failed')
      }

      const data = await res.json()
      if (data.success) {
        toast({
          title: 'Đăng nhập Local thành công!',
          description: 'Chào mừng bạn đến với môi trường phát triển Codebuff.',
        })
        window.location.href = data.callbackUrl || callbackUrl
      } else {
        throw new Error(data.error || 'Unknown error')
      }
    } catch (error) {
      toast({
        title: 'Đăng nhập bypass thất bại',
        description: error instanceof Error ? error.message : 'Đã xảy ra lỗi không xác định.',
        variant: 'destructive',
      })
      setIsLoading(false)
    }
  }

  return (
    <Button
      onClick={handleBypassLogin}
      disabled={isLoading}
      className="w-full bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 hover:from-emerald-600 hover:via-teal-600 hover:to-cyan-600 text-white font-medium shadow-md shadow-emerald-500/10 hover:shadow-emerald-500/20 active:scale-[0.98] transition-all duration-300 flex items-center justify-center gap-2 border-none h-10"
    >
      {isLoading ? (
        <Icons.loader className="mr-2 size-4 animate-spin" />
      ) : (
        <span className="text-base">🚀</span>
      )}
      Bypass Login (Developer Mode)
    </Button>
  )
}

export const SignInCardFooter = ({ authCode }: { authCode?: string | null }) => {
  const isDev = process.env.NODE_ENV === 'development'

  return (
    <CardFooter className="flex flex-col space-y-4 w-full">
      <SignInButton providerDomain="github.com" providerName="github" />
      {/* <SignInButton
                providerDomain="google.com"
                providerName="google"
              /> */}
      
      {isDev && (
        <div className="w-full flex flex-col space-y-4">
          <div className="relative flex py-1 items-center w-full">
            <div className="flex-grow border-t border-zinc-700"></div>
            <span className="flex-shrink mx-4 text-zinc-400 text-xs font-semibold uppercase tracking-wider">Local Only</span>
            <div className="flex-grow border-t border-zinc-700"></div>
          </div>
          <BypassLoginButton authCode={authCode} />
        </div>
      )}
    </CardFooter>
  )
}

