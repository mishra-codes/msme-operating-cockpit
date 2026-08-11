function Forbidden() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="text-center">
        <h1 className="text-6xl font-bold text-gray-900">
          403
        </h1>

        <p className="mt-3 text-xl text-gray-600">
          Access Denied
        </p>

        <p className="mt-2 text-gray-500">
          You don't have permission to access this page.
        </p>
      </div>
    </div>
  );
}

export default Forbidden;