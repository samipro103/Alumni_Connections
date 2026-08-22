"use client";

import Card from "../ui/Card";

export default function RightSidebar() {
  return (
    <div className="space-y-6">
      <Card>
        <h3 className="text-white font-bold text-lg">Tendencias</h3>

        <div className="mt-5 space-y-4">
          <Trend title="#Programación" />
          <Trend title="#IA" />
          <Trend title="#Microsoft" />
          <Trend title="#UGB" />
        </div>
      </Card>

      <Card>
        <h3 className="text-white font-bold">Personas sugeridas</h3>
      </Card>
    </div>
  );
}

function Trend({ title }: { title: string }) {
  return <div className="text-zinc-300 hover:text-white cursor-pointer">{title}</div>;
}
