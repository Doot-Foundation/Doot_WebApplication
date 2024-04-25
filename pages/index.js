import HomeLayout from "./components/home/HomeLayout";
import HomeHeader from "./components/home/HomeHeader";
import HomeHero from "./components/home/HomeHero";
import HomeFooter from "./components/home/HomeFooter";

export default function Home() {
  return (
    <>
      <HomeLayout>
        <HomeHeader />
        <HomeHero />
        <HomeFooter />
      </HomeLayout>
    </>
  );
}
