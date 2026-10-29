import { Suspense } from 'react'
import { supabase } from '@/lib/supabase'

async function Services() {
  const { data: services, error } = await supabase
    .from('services')
    .select('*')
    .eq('active', true)
    .order('id')

  if (error) return <p className="text-red-600">Ошибка: {error.message}</p>

  return (
    <div className="space-y-3">
      {services?.map((s) => (
        <div
          key={s.id}
          className="flex items-center justify-between rounded-3xl bg-white p-5 shadow-sm"
        >
          <div>
            <div className="font-semibold">{s.name}</div>
            <div className="text-sm text-[#6B6888]">{s.duration_min} мин</div>
          </div>
          <div className="font-bold">{s.price} ₽</div>
        </div>
      ))}
    </div>
  )
}

export default function Home() {
  return (
    <main className="min-h-screen bg-[#F4F2FB] px-6 py-10 text-[#3A3556]">
      <div className="mx-auto max-w-md">
        <h1 className="text-4xl font-bold tracking-tight">Не спеши,</h1>
        <h1 className="mb-2 text-4xl font-bold tracking-tight">стрижёмся спокойно</h1>
        <p className="mb-8 text-[#6B6888]">Запишись к барберу за пару касаний.</p>

        <Suspense fallback={<p className="text-[#6B6888]">Загрузка…</p>}>
          <Services />
        </Suspense>

        <button className="mt-8 h-14 w-full rounded-full bg-[#6E5CD6] font-semibold text-white">
          Записаться
        </button>
      </div>
    </main>
  )
}