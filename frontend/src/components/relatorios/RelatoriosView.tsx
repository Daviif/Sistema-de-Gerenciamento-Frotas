import { useRelatorioConsumo } from '@/hooks/useRelatorioConsumo'
import { useRelatorioManutencao } from '@/hooks/useRelatorioManutencao'
import { useRelatorioMotoristas } from '@/hooks/useRelatorioMotoristas'

export default function Relatorios() {
  const { data: consumo, isLoading: loadingConsumo } =
    useRelatorioConsumo()

  const { data: manutencao, isLoading: loadingManutencao } =
    useRelatorioManutencao()

  const { data: motoristas, isLoading: loadingMotoristas } =
    useRelatorioMotoristas()

  if (loadingConsumo || loadingManutencao || loadingMotoristas) {
    return <p>Carregando relatórios...</p>
  }

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold">Relatórios</h1>

      {/* 🔹 Consumo de combustível */}
      <section>
        <h2 className="text-xl font-semibold mb-2">
          Consumo de Combustível
        </h2>

        <ul className="space-y-1">
          {consumo?.map((item) => (
            <li key={item.id_veiculo}>
              {item.placa} — R$ {item.gasto_total.toFixed(2)}
            </li>
          ))}
        </ul>
      </section>

      {/* 🔹 Manutenção */}
      <section>
        <h2 className="text-xl font-semibold mb-2">
          Custos de Manutenção
        </h2>

        <ul className="space-y-1">
          {manutencao?.map((item) => (
            <li key={`${item.id_veiculo}-${item.tipo_manutencao}`}>
              {item.placa} ({item.tipo_manutencao}) — R$
              {item.custo_total.toFixed(2)}
            </li>
          ))}
        </ul>
      </section>

      {/* 🔹 Motoristas */}
      <section>
        <h2 className="text-xl font-semibold mb-2">
          Desempenho dos Motoristas
        </h2>

        <ul className="space-y-1">
          {motoristas?.map((item) => (
            <li key={item.id_motorista}>
              {item.nome} — {item.total_viagens} viagens / {item.km_total} km
            </li>
          ))}
        </ul>
      </section>
    </div>
  )
}
