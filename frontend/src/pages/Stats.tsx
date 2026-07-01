import { useState } from 'react';
import {NavBar} from '../components/NavBar';
import {Header} from '../components/Header';
import {
  Chart as ChartJS,
  ArcElement,
  BarElement,
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend,
} from "chart.js";

import { Doughnut } from "react-chartjs-2";
import {Bar} from "react-chartjs-2";

ChartJS.register(ArcElement, BarElement, CategoryScale, LinearScale, Tooltip, Legend);

export default function Stats() {
  const [isNavOpen, setIsNavOpen] = useState(false)

  const openNav = () => {
    setIsNavOpen(true)
  }

  const closeNav = () => {
    setIsNavOpen(false)
  }

  return (
    <div className={`min-h-screen bg-linear-to-t from-orange-500 to-gray-500 font-bold transition-[padding-left] duration-300 ${isNavOpen ? 'pl-32' : 'pl-16'}`}>
      <Header />
      <NavBar isOpen={isNavOpen} openNav={openNav} closeNav={closeNav} />
      <div className="p-4">
        <h2 className="text-2xl font-bold text-white">Stats</h2>
        <p className="text-gray-300">This is the stats page.</p>
      </div>
      <div className="w-1/2 ">
          <Doughnut data={{
          labels: ['Red', 'Blue', 'Yellow', 'Green', 'Purple', 'Orange'],
          datasets: [{
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
        <div className = 'w-1/2 bg-white inline-block'>
        <Bar data={{
          labels: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday' , 'Sunday'],
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
    </div>
  )
}
