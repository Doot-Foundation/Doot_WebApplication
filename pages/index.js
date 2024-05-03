import HomeLayout from "./components/home/HomeLayout";
import HomeHero from "./components/home/HomeHero";

export default function Home() {
  return (
    <>
      <HomeLayout>
        <HomeHero />
      </HomeLayout>
    </>
  );
}
