'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'

type Service = { id: number; name: string; price: number; duration_min: number }
type Barber = { id: number; name: string; role: string }
type Hours = {
  weekday: number
  start_time: string
  end_time: string
  break_start: string | null
  break_end: string | null
}
type Busy = { starts_at: string; ends_at: string }

const STEP_MIN = 30
const DAYS_AHEAD = 14
const COLORS = ['#D9D2FA', '#FFE3D6', '#D6EFE3', '#FDEBC8']
const TITLES = ['', 'Выбор услуги', 'Выбор барбера', 'Выбор времени', 'Подтверждение']

const toMin = (t: string) => {
  const [h, m] = t.split(':').map(Number)
  return h * 60 + m
}
const fmt = (min: number) =>
  `${String(Math.floor(min / 60)).padStart(2, '0')}:${String(min % 60).padStart(2, '0')}`
const startOfDay = (d: Date) => {
  const x = new Date(d)
  x.setHours(0, 0, 0, 0)
  return x
}
const addMin = (d: Date, m: number) => new Date(d.getTime() + m * 60000)
const rub = (n: number) => `${n.toLocaleString('ru-RU')} ₽`

export default function Booking() {
  const [step, setStep] = useState(1)
  const [services, setServices] = useState<Service[]>([])
  const [barbers, setBarbers] = useState<Barber[]>([])
  const [service, setService] = useState<Service | null>(null)
  const [barber, setBarber] = useState<Barber | null>(null)
  const [hours, setHours] = useState<Hours[]>([])
  const [busy, setBusy] = useState<Busy[]>([])
  const [date, setDate] = useState<Date>(startOfDay(new Date()))
  const [time, setTime] = useState<number | null>(null)
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const [tick, setTick] = useState(0)

  const days = useMemo(
    () =>
      Array.from({ length: DAYS_AHEAD }, (_, i) => {
        const d = startOfDay(new Date())
        d.setDate(d.getDate() + i)
        return d
      }),
    []
  )

  // Услуги и барберы
  useEffect(() => {
    Promise.all([
      supabase.from('services').select('*').eq('active', true).order('id'),
      supabase.from('barbers').select('*').eq('active', true).order('id'),
    ]).then(([s, b]) => {
      if (s.error || b.error) setError((s.error || b.error)!.message)
      setServices(s.data ?? [])
      setBarbers(b.data ?? [])
    })
  }, [])

  // Рабочие часы выбранного барбера
  useEffect(() => {
    if (!barber) return
    supabase
      .from('work_hours')
      .select('*')
      .eq('barber_id', barber.id)
      .then(({ data }) => setHours(data ?? []))
  }, [barber])

  // Занятое время на выбранный день
  useEffect(() => {
    if (!barber) return
    const from = startOfDay(date)
    const to = new Date(from)
    to.setDate(to.getDate() + 1)
    supabase
      .rpc('busy_slots', { p_barber: barber.id, p_from: from.toISOString(), p_to: to.toISOString() })
      .then(({ data }) => setBusy(data ?? []))
  }, [barber, date, tick])

  // Расчёт свободных слотов
  const slots = useMemo(() => {
    if (!service) return []
    const h = hours.find((x) => x.weekday === date.getDay())
    if (!h) return []
    const open = toMin(h.start_time)
    const close = toMin(h.end_time)
    const bs = h.break_start ? toMin(h.break_start) : null
    const be = h.break_end ? toMin(h.break_end) : null
    const day = startOfDay(date)
    const out: number[] = []
    for (let t = open; t + service.duration_min <= close; t += STEP_MIN) {
      const end = t + service.duration_min
      if (bs !== null && be !== null && bs < end && be > t) continue
      const s = addMin(day, t)
      const e = addMin(day, end)
      if (s.getTime() < Date.now()) continue
      if (busy.some((b) => new Date(b.starts_at) < e && new Date(b.ends_at) > s)) continue
      out.push(t)
    }
    return out
  }, [service, hours, busy, date])

  const phoneOk = phone.replace(/\D/g, '').length >= 10
  const canNext =
    (step === 1 && service) ||
    (step === 2 && barber) ||
    (step === 3 && time !== null) ||
    (step === 4 && name.trim().length > 1 && phoneOk)

  const submit = async () => {
    if (!service || !barber || time === null) return
    setSaving(true)
    setError('')
    const start = addMin(startOfDay(date), time)
    const end = addMin(start, service.duration_min)
    const { error } = await supabase.from('bookings').insert({
      client_name: name.trim(),
      client_phone: phone.trim(),
      barber_id: barber.id,
      service_id: service.id,
      starts_at: start.toISOString(),
      ends_at: end.toISOString(),
      status: 'pending',
    })
    setSaving(false)
    if (error) {
      if (error.code === '23P01') {
        setError('Это время только что заняли. Выберите другое.')
        setTime(null)
        setStep(3)
        setTick((t) => t + 1)
      } else {
        setError(error.message)
      }
      return
    }
    setStep(5)
  }

  const next = () => (step === 4 ? submit() : setStep(step + 1))
  const dateLabel = date.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' })

  const card = (selected: boolean) =>
    `flex w-full items-center gap-4 rounded-3xl bg-white p-4 text-left border-2 ${
      selected ? 'border-[#6E5CD6]' : 'border-transparent'
    }`

  return (
    <main className="min-h-screen bg-[#F4F2FB] text-[#3A3556]">
      <div className="mx-auto max-w-md px-6 pb-32 pt-6">
        {step < 5 && (
          <header className="mb-6 flex items-center gap-4">
            {step > 1 ? (
              <button onClick={() => setStep(step - 1)} className="h-11 w-11 rounded-full bg-white text-xl" aria-label="Назад">
                ‹
              </button>
            ) : (
              <Link href="/" className="flex h-11 w-11 items-center justify-center rounded-full bg-white text-xl" aria-label="На главную">
                ‹
              </Link>
            )}
            <h1 className="flex-1 pr-11 text-center text-lg font-bold">{TITLES[step]}</h1>
          </header>
        )}

        {error && <p className="mb-4 rounded-2xl bg-[#FFE3D6] p-3 text-sm text-[#D6536D]">{error}</p>}

        {step === 1 && (
          <div className="space-y-3">
            {services.map((s, i) => (
              <button key={s.id} onClick={() => setService(s)} className={card(service?.id === s.id)}>
                <div className="h-14 w-14 shrink-0 rounded-2xl" style={{ background: COLORS[i % 4] }} />
                <div className="flex-1">
                  <div className="font-semibold">{s.name}</div>
                  <div className="text-sm text-[#6B6888]">{s.duration_min} мин</div>
                </div>
                <div className="font-bold">{rub(s.price)}</div>
              </button>
            ))}
          </div>
        )}

        {step === 2 && (
          <div className="space-y-3">
            {barbers.map((b, i) => (
              <button
                key={b.id}
                onClick={() => {
                  setBarber(b)
                  setTime(null)
                }}
                className={card(barber?.id === b.id)}
              >
                <div
                  className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full text-xl font-bold"
                  style={{ background: COLORS[i % 4] }}
                >
                  {b.name[0]}
                </div>
                <div className="flex-1">
                  <div className="font-semibold">{b.name}</div>
                  <div className="text-sm text-[#6B6888]">{b.role}</div>
                </div>
              </button>
            ))}
          </div>
        )}

        {step === 3 && (
          <div>
            <div className="-mx-6 mb-6 flex gap-2 overflow-x-auto px-6 pb-2">
              {days.map((d) => {
                const on = d.getTime() === date.getTime()
                return (
                  <button
                    key={d.getTime()}
                    onClick={() => {
                      setDate(d)
                      setTime(null)
                    }}
                    className={`h-20 w-16 shrink-0 rounded-3xl ${on ? 'bg-[#6E5CD6] text-white' : 'bg-white'}`}
                  >
                    <div className={`text-xs ${on ? 'text-white' : 'text-[#6B6888]'}`}>
                      {d.toLocaleDateString('ru-RU', { weekday: 'short' })}
                    </div>
                    <div className="text-xl font-bold">{d.getDate()}</div>
                  </button>
                )
              })}
            </div>
            <h2 className="mb-3 font-bold">Свободное время</h2>
            {slots.length === 0 ? (
              <p className="text-[#6B6888]">На этот день свободного времени нет. Выберите другой день.</p>
            ) : (
              <div className="grid grid-cols-3 gap-3">
                {slots.map((t) => (
                  <button
                    key={t}
                    onClick={() => setTime(t)}
                    className={`h-12 rounded-3xl font-semibold ${time === t ? 'bg-[#6E5CD6] text-white' : 'bg-white'}`}
                  >
                    {fmt(t)}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {step === 4 && service && barber && time !== null && (
          <div className="space-y-4">
            <div className="rounded-3xl bg-white p-5">
              <div className="font-bold">{service.name}</div>
              <div className="text-sm text-[#6B6888]">
                {barber.name} · {dateLabel}, {fmt(time)}
              </div>
              <div className="mt-3 flex justify-between border-t border-[#E3DFF5] pt-3">
                <span className="text-[#6B6888]">Итого</span>
                <span className="font-bold">{rub(service.price)}</span>
              </div>
            </div>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ваше имя"
              className="h-14 w-full rounded-3xl border border-[#E3DFF5] bg-white px-5 outline-none focus:border-[#6E5CD6]"
            />
            <input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="Телефон, например +7 900 123-45-67"
              inputMode="tel"
              className="h-14 w-full rounded-3xl border border-[#E3DFF5] bg-white px-5 outline-none focus:border-[#6E5CD6]"
            />
          </div>
        )}

        {step === 5 && service && barber && time !== null && (
          <div className="pt-16 text-center">
            <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-[#D6EFE3] text-4xl">✓</div>
            <h1 className="mb-2 text-3xl font-bold">Вы записаны</h1>
            <p className="mb-8 text-[#6B6888]">
              {service.name}, {barber.name}
              <br />
              {dateLabel} в {fmt(time)}
            </p>
            <p className="mb-8 text-sm text-[#6B6888]">Администратор подтвердит запись и свяжется с вами.</p>
            <Link href="/" className="inline-block h-14 w-full rounded-full bg-[#6E5CD6] px-8 leading-[3.5rem] font-semibold text-white">
              На главную
            </Link>
          </div>
        )}
      </div>

      {step < 5 && (
        <div className="fixed inset-x-0 bottom-0 bg-[#F4F2FB] p-6">
          <button
            onClick={next}
            disabled={!canNext || saving}
            className="mx-auto block h-14 w-full max-w-md rounded-full bg-[#6E5CD6] font-semibold text-white disabled:opacity-40"
          >
            {step === 4 ? (saving ? 'Сохраняем…' : 'Записаться') : 'Далее'}
          </button>
        </div>
      )}
    </main>
  )
}