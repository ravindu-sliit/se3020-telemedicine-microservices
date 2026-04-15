import React from 'react';
import Navbar from './Navbar';

const DashboardLayout = ({ title, subtitle, tabs, activeTab, onTabChange, sidebarLinks, children }) => {
  return (
    <div className="page-wrapper">
      <Navbar />
      <div className="dashboard-layout">
        <aside className="dashboard-sidebar">
          <div className="sidebar-section">
            <div className="sidebar-section-title">Navigation</div>
            {sidebarLinks && sidebarLinks.map((link, index) => {
              const Icon = link.icon;
              return (
                <button
                  key={index}
                  className={`sidebar-link ${activeTab === link.id ? 'active' : ''}`}
                  onClick={() => onTabChange(link.id)}
                >
                  {Icon && <Icon style={{ width: 20, height: 20 }} />}
                  <span>{link.label}</span>
                </button>
              );
            })}
          </div>
        </aside>
        <main className="dashboard-main">
          <div className="dashboard-header animate-fade-in-up">
            <h1 className="dashboard-title">{title}</h1>
            {subtitle && <p className="dashboard-subtitle" style={{ marginBottom: 0 }}>{subtitle}</p>}
          </div>
          {tabs && (
            <div className="nav">
              {tabs.map(tab => (
                <button
                  key={tab.id}
                  className={`nav-link ${activeTab === tab.id ? 'active' : ''}`}
                  onClick={() => onTabChange(tab.id)}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          )}
          <div className="animate-fade-in-up delay-100">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
