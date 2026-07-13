/*
What kind of stats do we want?
- Number of songs listened to per day/week/month/year (bar chart)
- Number of unique genres listened to per day/week/month/year (doughnut chart)
- # of songs in library (no chart)
- # of playlists created (no chart)
- # of albums (no chart)
- Listening time trends over time (line chart) (can filter by genre, artist, album, playlist)
*/


import { useEffect, useState } from 'react';
import { NavBar } from '../components/NavBar';
import { Header } from '../components/Header';
import {
  Chart as ChartJS,
  ArcElement,
  BarElement,
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend,
  LineElement,
  PointElement,
} from "chart.js";

import { Doughnut, Line } from "react-chartjs-2";
import { Bar } from "react-chartjs-2";

ChartJS.register(ArcElement, BarElement, CategoryScale, LinearScale, Tooltip, Legend, LineElement, PointElement);


type Counts = {
  numSongs: number;
  numAlbums: number;
  numPlaylists: number;
};


export default function Stats() {
  const [isNavOpen, setIsNavOpen] = useState(false)
  const [nums, setNums] = useState<Counts | null>(null);

  const openNav = () => {
    setIsNavOpen(true)
  }

  const closeNav = () => {
    setIsNavOpen(false)
  }
  useEffect(() => {
  const getNumbers = async () => {
    const apiBaseUrl = "http://localhost:3000";
    try {
      const res = await fetch(`${apiBaseUrl}/api/counts`);
      if (!res.ok) {
        console.error(`Request failed with status ${res.status}`);
        return;
      }
      
      const data = (await res.json()) as Counts;
      setNums(data);
    } catch (error) {
      console.error("Failed to fetch results:", error);
    }
  };

getNumbers()
}, []);



  return (

    <div className={`min-h-screen bg-gray-500 font-bold transition-[padding-left] duration-300 ${isNavOpen ? 'pl-32' : 'pl-16'}`}>
      <Header />
      <NavBar isOpen={isNavOpen} openNav={openNav} closeNav={closeNav} />
      <div className='border border-[rgba(255,255,255,0.5)] rounded-2xl shadow-2xl m-5'>
        <p className="text-gray-300 mt-3 ml-10">You have {nums?.numSongs} songs in your library</p>
        <p className="text-gray-300 mt-3 ml-10">You have {nums?.numAlbums} albums in your library</p>
        <p className="text-gray-300 mt-3 ml-10">You have {nums?.numPlaylists} playlists in your library</p>
      </div>
      <div className="p-4">
        <h2 className="text-2xl font-bold text-white">Stats</h2>
        <p className="text-gray-300">This is the stats page.</p>
      </div>


      <div className="w-1/4">
        <Doughnut data={{
          labels: ['Red', 'Blue', 'Yellow', 'Green', 'Purple', 'Orange'],
          datasets: [{
            label: 'Songs',
            data: [12, 19, 3, 5, 2, 3],
            backgroundColor: [
              'rgba(255, 99, 132, 0.5)',
              'rgba(54, 162, 235, 0.5)',
              'rgba(255, 205, 86, 0.5)',
              'rgba(75, 192, 192, 0.5)',
              'rgba(153, 102, 255, 0.5)',
              'rgba(255, 159, 64, 0.5)'
            ],
            borderColor: [
              'rgba(255, 99, 132, 1)',
              'rgba(54, 162, 235, 1)',
              'rgba(255, 205, 86, 1)',
              'rgba(75, 192, 192, 1)',
              'rgba(153, 102, 255, 1)',
              'rgba(255, 159, 64, 1)'
            ],
            borderWidth: 1
          }]
        }} />
      </div>


      <div className='w-1/2 bg-white inline-block'>
        <Bar data={{
          labels: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
          datasets: [{
            label: 'Listen Time',
            data: [12, 19, 3, 5, 2, 3],
            backgroundColor: [
              'rgba(255, 99, 132, 0.5)',
              'rgba(54, 162, 235, 0.5)',
              'rgba(255, 205, 86, 0.5)',
              'rgba(75, 192, 192, 0.5)',
              'rgba(153, 102, 255, 0.5)',
              'rgba(255, 159, 64, 0.5)'
            ],
            borderColor: [
              'rgba(255, 99, 132, 1)',
              'rgba(54, 162, 235, 1)',
              'rgba(255, 205, 86, 1)',
              'rgba(75, 192, 192, 1)',
              'rgba(153, 102, 255, 1)',
              'rgba(255, 159, 64, 1)'
            ],
            borderWidth: 1
          }]
        }} />
      </div>
      <div className="w-1/4 bg-white">
        <Line data={{
          labels: ['January', 'February', 'March', 'April', 'May', 'June', 'July'],
          datasets: [{
            label: 'Listening Time',
            data: [65, 59, 80, 81, 90, 95, 80],
            fill: false,
            borderColor: 'rgb(53, 162, 235)',
            backgroundColor: 'rgba(53, 162, 235, 0.5)',
            tension: 0.1
          }]
        }} />
      </div>
    </div>
  )
}
