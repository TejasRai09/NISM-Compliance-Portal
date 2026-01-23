import { Doughnut } from 'react-chartjs-2';
import {
  ArcElement,
  Chart as ChartJS,
  Legend,
  Tooltip
} from 'chart.js';

ChartJS.register(ArcElement, Tooltip, Legend);

interface ModuleStat {
  moduleName: string;
  moduleCount: number;
  percent: number;
}

const buildColors = (count: number) => {
  return Array.from({ length: count }).map((_, i) => {
    const hue = Math.round((360 / Math.max(1, count)) * i);
    return `hsl(${hue}, 70%, 55%)`;
  });
};

const ModulePieChart = ({ data }: { data: ModuleStat[] }) => {
  const labels = data.map((d) => d.moduleName);
  const values = data.map((d) => d.moduleCount);
  const colors = buildColors(values.length);

  const chartData = {
    labels: [...labels],
    datasets: [
      {
        label: 'Certificates',
        data: [...values],
        backgroundColor: [...colors],
        borderWidth: 0
      },
      {
        label: 'Share',
        data: [...values],
        backgroundColor: colors.map((c) => c.replace('55%', '35%')),
        borderWidth: 0
      }
    ]
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: '55%',
    plugins: {
      legend: {
        display: false
      },
      tooltip: {
        callbacks: {
          title: (items: any[]) => items?.[0]?.label || '',
          label: (ctx: any) => `Certificates: ${ctx.raw || 0}`
        }
      }
    }
  };

  return (
    <div className="w-full h-64">
      <Doughnut data={chartData} options={options} />
    </div>
  );
};

export default ModulePieChart;
