import HomeLayout from "./components/home/HomeLayout";
import HomeHeader from "./components/home/HomeHeader";
import HomeHero from "./components/home/HomeHero";
import HomeFooter from "./components/home/HomeFooter";

import BackgroundImageComponent from "./components/common/BackgroundImageComponent";

export default function Home() {
  return (
    <>
      <HomeLayout>
        <BackgroundImageComponent imageURL="/static/images/portrait_1.jpg">
          <HomeHeader />
          <HomeHero />
        </BackgroundImageComponent>
        <HomeFooter />
      </HomeLayout>
    </>
  );
}
