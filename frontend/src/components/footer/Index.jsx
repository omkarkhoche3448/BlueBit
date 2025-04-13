
import Footer from "./Footer";

const Index = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <main className="flex-grow">
        <div className="min-h-[calc(100vh-400px)] flex items-center justify-center bg-gray-100">
          <div className="text-center px-4">
            <h1 className="text-4xl font-bold mb-4 text-gray-800">Welcome to KaamDekho</h1>
            <p className="text-xl text-gray-600 max-w-lg mx-auto">
              One search. All job opportunities.
              <br />
              Save time and find your dream job faster.
            </p>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Index;