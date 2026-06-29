import React, { useState, useMemo } from "react";
import { Box } from "@mui/material";
import GenericTable from "../Components/GenericTable";
import PackagingDialog from "../Components/PackagingDialog";
import FilterBar from "../Components/FilterBar";
import PageHeader from '../Components/Common/PageHeader';
import PageContainer from '../Components/Common/PageContainer';
import useLocaleStrings from "../hooks/useLocaleStrings";
import { useLanguage } from "../context/LanguageContext";
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchPackaging, addPackaging, deletePackaging, editPackaging } from '../Services/packagingService';
import packagingIllustration from '../assets/decor/page-headers/packaging-header-icon.svg';
import addPackagingIcon from '../assets/icons/actions/add-packaging.svg';

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

  const columns = [
    { field: "name",       headerName: strings.sidebar?.packaging || "שם" },
    { field: "cost",       headerName: strings.packaging?.cost    || "עלות" },
    { field: "stockUnits", headerName: strings.packaging?.stockUnits || "יחידות במלאי" }
  ];

  const filteredRows = useMemo(() => {
    return rows.filter(row => row.name.includes(search));
  }, [search, rows]);

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

  if (isLoading) return <div>טוען...</div>;
  if (error)     return <div>שגיאה בטעינת נתונים</div>;

  return (
    <Box>
      <PageContainer>
        <PageHeader
          title={strings.sidebar?.packaging || "מוצרי אריזה"}
          subtitle={strings.packaging?.subtitle || "ניהול מוצרי אריזה"}
          illustration={packagingIllustration}
          actionLabel={strings.packaging?.add || "הוסף מוצר אריזה"}
          actionIcon={addPackagingIcon}
          onActionClick={() => {
            setSelectedPackaging(null);
            setDialogOpen(true);
          }}
        />

        <FilterBar
          search={search}
          onSearchChange={setSearch}
          searchLabel={strings.filter?.search || "חפש לפי שם..."}
        />

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

        <PackagingDialog
          open={dialogOpen}
          onClose={() => {
            setDialogOpen(false);
            setSelectedPackaging(null);
          }}
          onSave={pkg => {
            if (selectedPackaging) {
              editMutation.mutate({ ...selectedPackaging, ...pkg });
            } else {
              mutation.mutate(pkg);
            }
            setDialogOpen(false);
            setSelectedPackaging(null);
          }}
          strings={strings}
          initialValues={selectedPackaging}
        />
      </PageContainer>
    </Box>
  );
}
