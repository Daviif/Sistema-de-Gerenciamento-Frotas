interface ResumoCardProps {
  titulo: string
  valor: string | number
}

export function ResumoCard({ titulo, valor }: ResumoCardProps) {
  return (
    <div className="rounded-xl bg-white p-4 shadow">
      <p className="text-sm text-gray-500">{titulo}</p>
      <p className="text-xl font-semibold">{valor}</p>
    </div>
  )
}
