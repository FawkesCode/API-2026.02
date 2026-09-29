function PageHeader({
  children,
  other,
}: {
  children: React.ReactNode;
  other?: React.ReactNode;
}) {
  return (
    <div className="border-b-2 border-blue-900 pb-2 mb-13 flex justify-between items-center">
      <h1 className="text-2xl text-card-foreground font-semibold italic capitalize flex  gap-2">
        {children}
      </h1>
      {other}
    </div>
  );
}

export default PageHeader;
