export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 p-4">
      <h1 className="text-4xl font-bold mb-4">404 - Not Found</h1>
      <p className="text-slate-600 dark:text-slate-400 mb-8">A página solicitada não foi encontrada.</p>
      <a href="/" className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors">Voltar para o início</a>
    </div>
  );
}
