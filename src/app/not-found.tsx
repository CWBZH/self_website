import Link from "next/link";
import { Home } from "lucide-react";

import { Button } from "@/components/ui/button";

export default function NotFound() {
    return (
        <div className="min-h-[calc(100vh-12rem)] flex flex-col">
            <div className="flex-1 flex items-center justify-center px-3 py-16 sm:p-8">
                <div className="flex flex-col items-center text-center max-w-md relative">
                    <h1 className="absolute -top-24 left-1/2 -translate-x-1/2 bg-linear-to-b from-primary/30 to-secondary/10 bg-clip-text font-mono text-[120px] font-semibold uppercase tracking-tighter text-transparent mask-[linear-gradient(to_bottom,black,black_20%,transparent_80%)] [-webkit-text-stroke:2px_hsl(var(--primary)/0.6)] sm:-top-40 sm:text-[200px] sm:[-webkit-text-stroke:3px_hsl(var(--primary)/0.6)]">
                        404
                    </h1>
                    <h2 className="mb-2 text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
                        Page Not Found
                    </h2>
                    <p className="text-muted-foreground mb-8 text-balance tracking-tight font-medium">
                        The page you&apos;re looking for doesn&apos;t exist or may have been moved.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-3">
                        <Link href="/">
                            <Button variant="outline" className="gap-2 cursor-pointer">
                                <Home className="h-4 w-4" />
                                Go to Home
                            </Button>
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}


