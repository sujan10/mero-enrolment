import { Button } from "../components/ui/button";

export default function HomePage() {
  return (
    <main className="flex flex-col items-center justify-center min-h-screen p-8">
      <h1 className="text-2xl font-bold mb-4">Mero Enrolment</h1>
      <Button className="bg-fuchsia-600 text-white hover:bg-fuchsia-700">Test Button</Button>
      <div className="mt-8 w-full max-w-md">
        <label className="block mb-2 font-medium">PDF Upload (placeholder)</label>
        <input type="file" accept="application/pdf" className="mb-4" disabled />
        <div className="border rounded p-4 bg-gray-50 text-gray-400 text-center">
          PDF preview will appear here (pdfjs-dist placeholder)
        </div>
      </div>
    </main>
  );
} 