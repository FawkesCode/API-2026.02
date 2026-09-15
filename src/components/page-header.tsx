function PageHeader({ title }: { title?: string }) {
  return (
    <div className="border-b-2 border-blue-900 pb-2 mb-5">
      <h1 className="text-2xl text-card-foreground font-semibold italic capitalize">
        {title}
      </h1>
    </div>
  );
}

export default PageHeader;
