import Header from './components/Header';
import DepositCard from './components/DepositCard';

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col bg-[var(--background)]">
      <Header />
      
      <main className="flex-1 flex items-center justify-center p-6 md:p-12">
        <DepositCard />
      </main>
    </div>
  );
}
