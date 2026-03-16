import { createBrowserRouter } from 'react-router-dom';
import { MapEditorPage } from '../pages/MapEditorPage';
import { MapsPage } from '../pages/MapsPage';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <MapsPage />,
  },
  {
    path: '/maps/:mapId',
    element: <MapEditorPage />,
  },
]);
