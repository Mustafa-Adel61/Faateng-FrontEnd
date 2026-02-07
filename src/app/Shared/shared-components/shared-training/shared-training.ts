import { NgIf, NgFor, NgClass } from '@angular/common';
import { Component } from '@angular/core';
import { SafeUrlPipe } from './safe-url.pipe';
import { SharedPageHeader } from '../../shared-layout/shared-page-header/shared-page-header';

@Component({
  selector: 'app-shared-training',
  imports: [NgIf,NgFor,SafeUrlPipe,SharedPageHeader],
  templateUrl: './shared-training.html',
  styleUrl: './shared-training.css'
})
export class SharedTraining {

activeTab = 'Lifts';
    changeTab(tab: string) {
    this.activeTab = tab;
  }


  selectedVideo: any = null;

  videos = [
    {
      title: 'Elevator systems 101',
      description: 'Learn the basics of elevator systems in this introductory course.',
      link: 'https://www.youtube.com/embed/tgbNymZ7vqY'
    },
    {
      title: 'Elevator systems 103',
      description: 'Explore the main components of traction elevator systems.',
      link: 'https://www.youtube.com/embed/jNQXAC9IVRw'
    },
    {
      title: 'Elevator systems 104',
      description: 'Learn key safety measures for elevator systems.',
      link: 'https://www.youtube.com/embed/Sagg08DrO5U'
    },
    {
      title: 'Elevator systems 101',
      description: 'Learn the basics of elevator systems in this introductory course.',
      link: 'https://www.youtube.com/embed/tgbNymZ7vqY'
    },
    {
      title: 'Elevator systems 103',
      description: 'Explore the main components of traction elevator systems.',
      link: 'https://www.youtube.com/embed/jNQXAC9IVRw'
    },
    {
      title: 'Elevator systems 104',
      description: 'Learn key safety measures for elevator systems.',
      link: 'https://www.youtube.com/embed/Sagg08DrO5U'
    },
    {
      title: 'Elevator systems 101',
      description: 'Learn the basics of elevator systems in this introductory course.',
      link: 'https://www.youtube.com/embed/tgbNymZ7vqY'
    },
    {
      title: 'Elevator systems 103',
      description: 'Explore the main components of traction elevator systems.',
      link: 'https://www.youtube.com/embed/jNQXAC9IVRw'
    },
    {
      title: 'Elevator systems 104',
      description: 'Learn key safety measures for elevator systems.',
      link: 'https://www.youtube.com/embed/Sagg08DrO5U'
    },
    {
      title: 'Elevator systems 101',
      description: 'Learn the basics of elevator systems in this introductory course.',
      link: 'https://www.youtube.com/embed/tgbNymZ7vqY'
    },
    {
      title: 'Elevator systems 103',
      description: 'Explore the main components of traction elevator systems.',
      link: 'https://www.youtube.com/embed/jNQXAC9IVRw'
    },
    {
      title: 'Elevator systems 104',
      description: 'Learn key safety measures for elevator systems.',
      link: 'https://www.youtube.com/embed/Sagg08DrO5U'
    },
    {
      title: 'Elevator systems 101',
      description: 'Learn the basics of elevator systems in this introductory course.',
      link: 'https://www.youtube.com/embed/tgbNymZ7vqY'
    },
    {
      title: 'Elevator systems 103',
      description: 'Explore the main components of traction elevator systems.',
      link: 'https://www.youtube.com/embed/jNQXAC9IVRw'
    },
    {
      title: 'Elevator systems 104',
      description: 'Learn key safety measures for elevator systems.',
      link: 'https://www.youtube.com/embed/Sagg08DrO5U'
    },
  ];

  playVideo(video: any) {
    this.selectedVideo = video;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

}

