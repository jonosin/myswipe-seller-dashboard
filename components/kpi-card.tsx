type Props = {
  title: string;
  value: string;
  subtext?: string;
};

export default function KpiCard({ title, value, subtext }: Props) {
  return (
    <div className="card p-4">
      <div className="text-sm text-neutral-600">{title}</div>
      <div className="text-2xl font-semibold mt-1">{value}</div>
      {subtext && <div className="text-sm text-neutral-500 mt-2">{subtext}</div>}
    </div>
  );
}
