import Link from 'next/link'

function Scissors() {
  return (
    <svg viewBox="0 0 120 120" className="h-52 w-52" aria-hidden="true">
      <line x1="75.5" y1="75.6" x2="36" y2="18" stroke="#EDE9FD" strokeWidth="11" strokeLinecap="round" />
      <line x1="44.5" y1="75.6" x2="84" y2="18" stroke="#B9AEF5" strokeWidth="19" strokeLinecap="round" />
      <line x1="44.5" y1="75.6" x2="84" y2="18" stroke="#FFFFFF" strokeWidth="11" strokeLinecap="round" />
      <circle cx="36" cy="88" r="15" fill="none" stroke="#2B2745" strokeWidth="8" />
      <circle cx="84" cy="88" r="15" fill="none" stroke="#FFC9A8" strokeWidth="8" />
      <circle cx="60" cy="53" r="4.5" fill="#FFC9A8" />
    </svg>
  )
}

function Logo() {
  return (
    <svg viewBox="0 0 120 120" className="h-9 w-9" aria-hidden="true">
      <line x1="75" y1="76" x2="36" y2="18" stroke="#B9AEF5" strokeWidth="12" strokeLinecap="round" />
      <line x1="45" y1="76" x2="84" y2="18" stroke="#8E7CF0" strokeWidth="12" strokeLinecap="round" />
      <circle cx="36" cy="88" r="15" fill="none" stroke="#8E7CF0" strokeWidth="8" />
      <circle cx="84" cy="88" r="15" fill="none" stroke="#FFC9A8" strokeWidth="8" />
    </svg>
  )
}

export default function Home() {
  return (
    <main className="min-h-screen bg-[#F4F2FB] text-[#3A3556]">
      <div className="mx-auto flex min-h-screen max-w-md flex-col px-6 pb-10 pt-6">
        <div className="mb-6 flex items-center gap-3">
          <Logo />
          <span className="text-lg font-bold tracking-tight">barbershop</span>
        </div>

        <div className="relative mb-10 flex h-80 items-center justify-center overflow-hidden rounded-[36px] bg-[#B9AEF5]">
          <div className="absolute -right-10 -top-10 h-44 w-44 rounded-full bg-[#FFC9A8]" />
          <div className="absolute -bottom-16 -left-10 h-56 w-56 rounded-full bg-[#D9D2FA]" />
          <div className="absolute -bottom-4 -right-2 h-20 w-20 rounded-full bg-white" />
          <div className="relative">
            <Scissors />
          </div>
        </div>

        <h1 className="text-[34px] font-bold leading-[1.15] tracking-tight">
          Не спеши,
          <br />
          стрижёмся спокойно
        </h1>
        <p className="mt-4 text-[15px] leading-relaxed text-[#6B6888]">
          Запишись к барберу за пару касаний — без звонков и ожидания.
        </p>

        <div className="mt-auto pt-10">
          <Link
            href="/book"
            className="flex h-14 w-full items-center justify-center rounded-full bg-[#6E5CD6] text-base font-semibold text-white"
          >
            Записаться
          </Link>
          <p className="mt-5 text-center text-sm text-[#6B6888]">
            Уже есть аккаунт? <span className="font-semibold text-[#6E5CD6]">Войти</span>
          </p>
        </div>
      </div>
    </main>
  )
}