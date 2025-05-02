import Header from './components/Header';
import DepositCard from './components/DepositCard';
import SecondDepositCard from './components/SecondDepositCard';

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col bg-[var(--background)]">
      <Header />
      
      <main className="flex-1 flex flex-col md:flex-row items-center justify-center gap-8 p-6 md:p-12">
        <DepositCard />
        <SecondDepositCard />
      </main>
    </div>
  );
}
