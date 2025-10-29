// src/routes/index.tsx

import { createFileRoute, Link, useRouter } from "@tanstack/react-router"
import { Button } from "@/components/ui/button"

export const Route = createFileRoute('/')({
    component: Home,
  })

function Home() {
  const router = useRouter()

  return (
    <div className="font-sans grid grid-rows-[20px_1fr_20px] items-center justify-items-center min-h-screen p-8 pb-20 gap-16 sm:p-20">
        <main className="flex flex-col gap-1 row-start-2 items-center">
            <h1 className="text-4xl font-bold w-min text-center">
                <b className="text-destructive">@BTST/STACK</b> example with
            </h1>
            <img
                className="max-w-[100px] w-full"
                src="https://avatars.githubusercontent.com/u/72518640?s=200&v=4"
                alt="TanStack Logo"
            />
            <div className="flex flex-col gap-2 items-center m-8 border-2 border-destructive rounded-md pb-2">
                <b className="border-b-2 border-destructive w-full text-center p-2">Pages:</b>
                <Button className="text-destructive" variant="link" asChild>
                    <Link to="/pages/$"
                    params={{
                        _splat: "blog",
                    }}
                    >Blog</Link>
                </Button>
                <Button className="text-destructive" variant="link" asChild>
                    <Link to="/pages/$"
                    params={{
                        _splat: "blog/drafts",
                    }}
                    >Drafts</Link>
                </Button>
                <Button className="text-destructive" variant="link" asChild>
                    <Link to="/pages/$"
                    params={{
                        _splat: "blog/new",
                    }}
                    >New Post</Link>
                </Button>
            </div>
        </main>
    </div>
  )
}