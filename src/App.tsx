// App.tsx (updated)
import { RouterProvider } from 'react-router-dom';
import { router } from './routes/routes';
import { ConfigProvider } from 'antd';
//import DeveloperFooter from './components/DeveloperFooter'; // Import the footer
import HoverFooter from './components/footer/HoverFooter';
// import AutoHideFooter from './components/footer/AutoHideFooter';
const App = () => {
  return (
    <>
      <ConfigProvider
        theme={{
          token: {
            fontFamily: 'Nunito',
          },
        }}
      >
        <RouterProvider router={router} />
        {/* <DeveloperFooter /> Add the footer here */}
        <HoverFooter />
        {/* <AutoHideFooter /> */}
      </ConfigProvider>
    </>
  );
};

export default App;