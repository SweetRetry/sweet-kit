"use client"

import { Button } from "@workspace/ui/components/button"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@workspace/ui/components/form"
import { Input } from "@workspace/ui/components/input"

import { authClient } from "@/lib/auth-client"
import { useForm, z, zodResolver } from "@/lib/form"
import { toast } from "@/lib/toast"

const signInSchema = z.object({
  email: z.email({ error: "请输入有效邮箱" }),
  password: z.string().min(8, "密码至少 8 位"),
})

type SignInValues = z.infer<typeof signInSchema>

export function SignInForm({ redirectTo }: { redirectTo: string }) {
  const form = useForm<SignInValues>({
    defaultValues: { email: "", password: "" },
    resolver: zodResolver(signInSchema),
  })

  async function onSubmit(values: SignInValues) {
    const result = await authClient.signIn.email({ email: values.email, password: values.password })

    if (result.error) {
      toast.error(result.error.message ?? "登录失败")
      return
    }

    window.location.assign(redirectTo)
  }

  return (
    <Form {...form}>
      <form className="space-y-4" onSubmit={form.handleSubmit(onSubmit)}>
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>邮箱</FormLabel>
              <FormControl>
                <Input
                  type="email"
                  placeholder="name@example.com"
                  autoComplete="email"
                  {...field}
                />
              </FormControl>
              {/* 预留一行错误位：校验提示出现时不推动下方字段（UI Stability） */}
              <div className="min-h-5">
                <FormMessage />
              </div>
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel>密码</FormLabel>
              <FormControl>
                <Input
                  type="password"
                  placeholder="输入密码"
                  autoComplete="current-password"
                  {...field}
                />
              </FormControl>
              <div className="min-h-5">
                <FormMessage />
              </div>
            </FormItem>
          )}
        />
        <Button className="w-full" type="submit" disabled={form.formState.isSubmitting}>
          {form.formState.isSubmitting ? "登录中…" : "登录"}
        </Button>
      </form>
    </Form>
  )
}
