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

const signUpSchema = z.object({
  email: z.email({ error: "请输入有效邮箱" }),
  name: z.string().min(1, "请输入名称").max(100, "名称过长"),
  password: z.string().min(8, "密码至少 8 位"),
})

type SignUpValues = z.infer<typeof signUpSchema>

export function SignUpForm({ redirectTo }: { redirectTo: string }) {
  const form = useForm<SignUpValues>({
    defaultValues: { email: "", name: "", password: "" },
    resolver: zodResolver(signUpSchema),
  })

  async function onSubmit(values: SignUpValues) {
    const result = await authClient.signUp.email({
      email: values.email,
      name: values.name,
      password: values.password,
    })

    if (result.error) {
      toast.error(result.error.message ?? "注册失败")
      return
    }

    window.location.assign(redirectTo)
  }

  return (
    <Form {...form}>
      <form className="space-y-4" onSubmit={form.handleSubmit(onSubmit)}>
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>名称</FormLabel>
              <FormControl>
                <Input placeholder="输入名称" autoComplete="name" {...field} />
              </FormControl>
              <div className="min-h-5">
                <FormMessage />
              </div>
            </FormItem>
          )}
        />
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
                  placeholder="至少 8 位"
                  autoComplete="new-password"
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
          {form.formState.isSubmitting ? "创建中…" : "创建账号"}
        </Button>
      </form>
    </Form>
  )
}
