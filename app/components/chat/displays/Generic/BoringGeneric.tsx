"use client";

import DataTable from "@/app/components/explorer/DataTable";

interface BoringGenericDisplayProps {
  payload: { [key: string]: string }[];
}

const BoringGenericDisplay: React.FC<BoringGenericDisplayProps> = ({
  payload,
}) => {
  // Handle empty payload case
  if (!payload || payload.length === 0) {
    return (
      <div className="w-full flex flex-col justify-center items-center p-8">
        <p className="text-secondary text-sm">No data returned from query</p>
      </div>
    );
  }

  return (
    <div className="w-full flex flex-col justify-start items-start">
      <DataTable
        data={payload}
        header={payload[0] || {}}
        stickyHeaders={true}
        maxHeight="30vh"
      />
    </div>
  );
};

export default BoringGenericDisplay;
