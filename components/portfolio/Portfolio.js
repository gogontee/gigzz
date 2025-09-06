// components/portfolio/Portfolio.js
'use client';

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "../../utils/supabaseClient";
import EmptyState from "./EmptyState";
import PortfolioCard from "./PortfolioCard";

export default function Portfolio() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProjects = async () => {
      setLoading(true);

      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        console.error("User not found:", userError);
        setLoading(false);
        return;
      }

      // Fetch projects created by the current user
      const { data, error } = await supabase
        .from("projects")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching projects:", error);
      } else {
        // Map project data to include only the fields needed by PortfolioCard
        const mappedProjects = (data || []).map((p) => ({
          id: p.id,
          title: p.title,
          details: p.details,
          profile: p.profile, // banner image
        }));

        setProjects(mappedProjects);
      }

      setLoading(false);
    };

    fetchProjects();
  }, []);

  return (
    <div className="pt-10 md:pt-20">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">My Portfolio</h1>

        <Link
          href="/dashboard/applicant/create-portfolio"
          className="px-2 py-1 text-sm md:px-4 md:py-2 md:text-base rounded-lg bg-black text-white hover:bg-orange-600 transition"
        >
          Create Portfolio
        </Link>
      </div>

      {loading ? (
        <p>Loading projects...</p>
      ) : projects.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map((project) => (
            <PortfolioCard
              key={project.id}
              projectData={project} // pass the mapped project
            />
          ))}
        </div>
      )}
    </div>
  );
}
