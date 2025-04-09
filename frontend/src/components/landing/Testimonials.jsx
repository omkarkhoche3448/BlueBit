import { useEffect, useState } from "react";
import { motion } from "framer-motion";

const Testimonials = () => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
        }
      },
      {
        threshold: 0.1,
      }
    );

    const section = document.getElementById("testimonials");
    if (section) observer.observe(section);

    return () => {
      if (section) observer.unobserve(section);
    };
  }, []);

  const testimonials = [
    {
      name: "Sarah Johnson",
      role: "UX Designer",
      company: "Airbnb",
      quote:
        "KaamDekho saved me so much time in my job search. I found opportunities I would have missed otherwise, and landed my dream job in just 3 weeks!",
      avatar: "https://randomuser.me/api/portraits/women/1.jpg",
    },
    {
      name: "Michael Chen",
      role: "Software Engineer",
      company: "Google",
      quote:
        "The unified search across multiple platforms is a game-changer. I was able to compare offers easily and negotiate a better salary package.",
      avatar: "https://randomuser.me/api/portraits/men/2.jpg",
    },
    {
      name: "Priya Patel",
      role: "Marketing Manager",
      company: "Spotify",
      quote:
        "As someone who was looking for remote opportunities, KaamDekho's filtering options helped me find exactly what I was looking for without the usual hassle.",
      avatar: "https://randomuser.me/api/portraits/women/3.jpg",
    },
  ];

  const staggerContainer = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const fadeInUp = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.5,
      },
    },
  };

  return (
    <section id="testimonials" className="py-16 sm:py-20 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          className="text-center mb-12 sm:mb-16"
          initial={{ opacity: 0, y: 40 }}
          animate={
            isVisible
              ? { opacity: 1, y: 0 }
              : { opacity: 0, y: 40 }
          }
          transition={{ duration: 0.7 }}
        >
          <h2 className="text-base font-semibold tracking-wide uppercase text-blue-600">
            Testimonials
          </h2>
          <p className="mt-2 text-2xl sm:text-3xl font-extrabold text-gray-900 sm:text-4xl lg:text-5xl">
            Success stories from our users
          </p>
          <p className="mt-4 max-w-2xl text-lg sm:text-xl text-gray-500 mx-auto">
            Hear from job seekers who found their dream positions using
            KaamDekho.
          </p>
        </motion.div>

        {/* Testimonials grid - Responsive for mobile */}
        <motion.div
          className="grid gap-6 sm:gap-8 md:grid-cols-3"
          variants={staggerContainer}
          initial="hidden"
          animate={isVisible ? "visible" : "hidden"}
        >
          {testimonials.map((testimonial, index) => (
            <motion.div
              key={index}
              className="bg-white rounded-xl shadow-md overflow-hidden p-6 sm:p-8 hover:shadow-xl transition-shadow duration-300"
              variants={fadeInUp}
            >
              <div className="flex items-center mb-6">
                <div className="h-12 w-12 rounded-full overflow-hidden mr-4 flex-shrink-0">
                  <img
                    src={testimonial.avatar || "/placeholder.svg"}
                    alt={testimonial.name}
                    width={48}
                    height={48}
                    className="h-full w-full object-cover"
                    loading="lazy"
                  />
                </div>
                <div>
                  <h3 className="text-lg font-medium text-gray-900">
                    {testimonial.name}
                  </h3>
                  <p className="text-sm text-gray-500">{testimonial.role}</p>
                  <p className="text-sm text-blue-600">
                    {testimonial.company}
                  </p>
                </div>
              </div>
              <p className="text-gray-600 italic">"{testimonial.quote}"</p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
};

export default Testimonials;