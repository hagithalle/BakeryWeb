import React, { useState, useMemo } from "react";
import { Typography, Box } from "@mui/material";
import GenericTable from "../Components/GenericTable";
import useLocaleStrings from "../hooks/useLocaleStrings";
import { useLanguage } from "../context/LanguageContext";
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchPackaging, addPackaging, deletePackaging, editPackaging } from '../Services/packagingServices';

export default function PackagingPage() {
  const { lang } = useLanguage();
  const strings = useLocaleStrings(lang);
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedPackaging, setSelectedPackaging] = useState(null);
  const queryClient = useQueryClient();

  const { data: rows = [], isLoading, error } = useQuery({
    queryKey: ['packaging'],
    queryFn: fetchPackaging
  });

  const mutation = useMutation({
    mutationFn: addPackaging,
    onSuccess: () => queryClient.invalidateQueries(['packaging'])
  });
  const editMutation = useMutation({
    mutationFn: editPackaging,
    onSuccess: () => queryClient.invalidateQueries(['packaging'])
  });
  const deleteMutation = useMutation({
    mutationFn: deletePackaging,
    onSuccess: () => queryClient.invalidateQueries(['packaging'])
  });

  const columns = [
    { field: "name", headerName: strings.sidebar?.packaging || "שם" },
    { field: "cost", headerName: strings.packaging?.cost || "עלות" },
    { field: "stockUnits", headerName: strings.packaging?.stockUnits || "יחידות במלאי" }
  ];

  const filteredRows = useMemo(() => {
    return rows.filter(row => row.name.includes(search));
  }, [search, rows]);

  if (isLoading) return <div>טוען...</div>;
  if (error) return <div>שגיאה בטעינת נתונים</div>;

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
        <input
          type="text"
          placeholder={strings.filter?.search || "חפש לפי שם"}
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </Box>
      <GenericTable
        columns={columns}
        rows={filteredRows}
        direction={strings.direction}
        actions={["edit", "delete"]}
        onEdit={row => {
          setSelectedPackaging(row);
          setDialogOpen(true);
        }}
        onDelete={row => {
          if (window.confirm("האם למחוק את " + row.name + "?")) {
            deleteMutation.mutate(row.id);
          }
        }}
      />
      {/* כאן אפשר להוסיף דיאלוג להוספה/עריכה */}
    </Box>
  );
}
