import HomeLayout from "./components/home/HomeLayout";
import HomeHero from "./components/home/HomeHero";
import Footer from "./components/common/Footer";

export default function Home() {
  return (
    <>
      <HomeLayout>
        <HomeHero />
        <Footer />
      </HomeLayout>
    </>
  );
}
