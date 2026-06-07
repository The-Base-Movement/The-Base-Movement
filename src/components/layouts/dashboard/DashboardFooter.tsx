import { Link } from 'react-router-dom'

export default function DashboardFooter() {
  return (
    <footer className="mt-16 py-10 px-12 border-t border-border/10 bg-muted/5">
      <div className="max-w-[1440px] mx-auto flex flex-col md:flex-row justify-between items-center gap-8">
        <p className="text-micro text-muted-foreground/40 mb-0 font-medium tracking-tight uppercase">
          © {new Date().getFullYear()} The Base Movement. National Infrastructure.
        </p>
        <div className="flex flex-wrap justify-center items-center gap-6">
          <Link
            className="font-medium text-micro uppercase text-muted-foreground/40 hover:text-primary transition-colors"
            to="/dashboard/privacy"
          >
            Privacy
          </Link>
          <Link
            className="font-medium text-micro uppercase text-muted-foreground/40 hover:text-primary transition-colors"
            to="/dashboard/terms"
          >
            Terms
          </Link>
          <Link
            className="font-medium text-micro uppercase text-muted-foreground/40 hover:text-primary transition-colors"
            to="/dashboard/contact"
          >
            Support
          </Link>
        </div>
      </div>
    </footer>
  )
}
