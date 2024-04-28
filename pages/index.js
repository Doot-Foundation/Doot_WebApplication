import HomeLayout from "./components/home/HomeLayout";
import Header from "./components/common/Header";
import HomeHero from "./components/home/HomeHero";
import Footer from "./components/common/Footer";

export default function Home() {
  return (
    <>
      <HomeLayout>
        <Header />
        <HomeHero />
        <Footer />
      </HomeLayout>
    </>
  );
}
