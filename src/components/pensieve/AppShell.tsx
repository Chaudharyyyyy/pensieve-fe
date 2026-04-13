import { TopNav } from "@/components/pensieve/TopNav";

interface AppShellProps {
  children: React.ReactNode;
}

export const AppShell = ({ children }: AppShellProps) => {
  return (
    <div className="min-h-screen bg-pen-black film-grain">
      <TopNav />
      <main className="pt-14">
        {children}
      </main>
    </div>
  );
};
